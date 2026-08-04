<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class EventosController {
    private $evento;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->evento = new Evento($db);
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
        $stmt = $this->evento->read($id_usuario);
        
        $eventos = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($eventos, $row);
        }
        
        echo json_encode($eventos);
    }
    
    public function listarPorData($data) {
        $id_usuario = $this->getUserId();
        $stmt = $this->evento->readByDate($id_usuario, $data);
        
        $eventos = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($eventos, $row);
        }
        
        echo json_encode($eventos);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->evento->id_evento = $id;
        
        // Precisa de um método readOne no model (vou adicionar)
        $query = "SELECT * FROM PI_Eventos WHERE id_evento = ? AND id_usuario = ?";
        $stmt = $this->evento->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->bindParam(2, $id_usuario);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Evento não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->tipo) || empty($data->data)) {
            http_response_code(400);
            echo json_encode(["message" => "Tipo e data do evento são obrigatórios"]);
            return;
        }
        
        $this->evento->id_usuario = $id_usuario;
        $this->evento->tipo = $data->tipo;
        $this->evento->data = $data->data;
        $this->evento->cor = $data->cor ?? '#00FF00';
        
        if($this->evento->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Evento criado com sucesso",
                "id_evento" => $this->evento->id_evento
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar evento. Verifique se o usuário existe."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->evento->id_evento = $id;
        $this->evento->id_usuario = $id_usuario;
        $this->evento->tipo = $data->tipo ?? null;
        $this->evento->data = $data->data ?? null;
        $this->evento->cor = $data->cor ?? null;
        
        if($this->evento->update()) {
            echo json_encode(["message" => "Evento atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar evento"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->evento->id_evento = $id;
        $this->evento->id_usuario = $id_usuario;
        
        if($this->evento->delete()) {
            echo json_encode(["message" => "Evento deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar evento"]);
        }
    }
}
?>