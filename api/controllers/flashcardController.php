<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class FlashController {
    private $flash;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->flash = new Flash($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->flash->read($id_usuario);
        
        $flashcards = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($flashcards, $row);
        }
        
        echo json_encode($flashcards);
    }
    
    public function listarPorMateria($id_materia) {
        $id_usuario = $this->getUserId();
        $stmt = $this->flash->readByMateria($id_usuario, $id_materia);
        
        $flashcards = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($flashcards, $row);
        }
        
        echo json_encode($flashcards);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->flash->id_flash = $id;
        
        $query = "SELECT * FROM PI_Flash WHERE id_flash = ? AND id_usuario = ?";
        $stmt = $this->flash->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->bindParam(2, $id_usuario);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Flashcard não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->id_materia) || empty($data->pergunta) || empty($data->resposta)) {
            http_response_code(400);
            echo json_encode(["message" => "Matéria, pergunta e resposta são obrigatórios"]);
            return;
        }
        
        $this->flash->id_materia = $data->id_materia;
        $this->flash->id_usuario = $id_usuario;
        $this->flash->pergunta = $data->pergunta;
        $this->flash->tema = $data->tema ?? null;
        $this->flash->resposta = $data->resposta;
        
        if($this->flash->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Flashcard criado com sucesso",
                "id_flash" => $this->flash->id_flash
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar flashcard. Verifique se o usuário e a matéria existem."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->flash->id_flash = $id;
        $this->flash->id_usuario = $id_usuario;
        $this->flash->pergunta = $data->pergunta ?? null;
        $this->flash->tema = $data->tema ?? null;
        $this->flash->resposta = $data->resposta ?? null;
        
        if($this->flash->update()) {
            echo json_encode(["message" => "Flashcard atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar flashcard"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->flash->id_flash = $id;
        $this->flash->id_usuario = $id_usuario;
        
        if($this->flash->delete()) {
            echo json_encode(["message" => "Flashcard deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar flashcard"]);
        }
    }
}
?>