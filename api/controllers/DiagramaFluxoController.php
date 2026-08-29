<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class DiagramaFluxoController {
    private $diagrama;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->diagrama = new DiagramaFluxo($db);
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
        $stmt = $this->diagrama->read($id_usuario);
        
        $diagramas = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['nos'] = json_decode($row['nos']);
            $row['conexoes'] = json_decode($row['conexoes']);
            array_push($diagramas, $row);
        }
        
        echo json_encode($diagramas);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->diagrama->id_diagrama = $id;
        $this->diagrama->id_usuario = $id_usuario;
        
        if($this->diagrama->readOne()) {
            echo json_encode([
                "id_diagrama" => $this->diagrama->id_diagrama,
                "id_usuario" => $this->diagrama->id_usuario,
                "titulo" => $this->diagrama->titulo,
                "data" => $this->diagrama->data,
                "nos" => json_decode($this->diagrama->nos),
                "conexoes" => json_decode($this->diagrama->conexoes)
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Diagrama de fluxo não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->titulo)) {
            http_response_code(400);
            echo json_encode(["message" => "Título é obrigatório"]);
            return;
        }
        
        $this->diagrama->id_usuario = $id_usuario;
        $this->diagrama->titulo = $data->titulo;
        $this->diagrama->data = $data->data ?? date('Y-m-d H:i:s');
        $this->diagrama->nos = isset($data->nos) ? json_encode($data->nos) : '[]';
        $this->diagrama->conexoes = isset($data->conexoes) ? json_encode($data->conexoes) : '[]';
        
        if($this->diagrama->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Diagrama de fluxo criado com sucesso",
                "id_diagrama" => $this->diagrama->id_diagrama
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar diagrama de fluxo."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->diagrama->id_diagrama = $id;
        $this->diagrama->id_usuario = $id_usuario;
        
        if(!$this->diagrama->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Diagrama de fluxo não encontrado"]);
            return;
        }
        
        $this->diagrama->titulo = $data->titulo ?? $this->diagrama->titulo;
        $this->diagrama->data = $data->data ?? date('Y-m-d H:i:s');
        $this->diagrama->nos = isset($data->nos) ? json_encode($data->nos) : $this->diagrama->nos;
        $this->diagrama->conexoes = isset($data->conexoes) ? json_encode($data->conexoes) : $this->diagrama->conexoes;
        
        if($this->diagrama->update()) {
            echo json_encode(["message" => "Diagrama de fluxo atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar diagrama de fluxo"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->diagrama->id_diagrama = $id;
        $this->diagrama->id_usuario = $id_usuario;
        
        if($this->diagrama->delete()) {
            echo json_encode(["message" => "Diagrama de fluxo deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar diagrama de fluxo"]);
        }
    }
}
?>
