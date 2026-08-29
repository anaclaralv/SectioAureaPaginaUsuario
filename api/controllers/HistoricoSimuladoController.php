<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class HistoricoSimuladoController {
    private $simulado;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->simulado = new HistoricoSimulado($db);
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
        $stmt = $this->simulado->read($id_usuario);
        
        $simulados = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['acertos'] = (int)$row['acertos'];
            $row['erros'] = (int)$row['erros'];
            $row['taxa'] = (float)$row['taxa'];
            $row['total'] = (int)$row['total'];
            array_push($simulados, $row);
        }
        
        echo json_encode($simulados);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->simulado->id_simulado = $id;
        $this->simulado->id_usuario = $id_usuario;
        
        if($this->simulado->readOne()) {
            echo json_encode([
                "id_simulado" => $this->simulado->id_simulado,
                "id_usuario" => $this->simulado->id_usuario,
                "data" => $this->simulado->data,
                "materia" => $this->simulado->materia,
                "acertos" => (int)$this->simulado->acertos,
                "erros" => (int)$this->simulado->erros,
                "taxa" => (float)$this->simulado->taxa,
                "total" => (int)$this->simulado->total
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Simulado não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->materia)) {
            http_response_code(400);
            echo json_encode(["message" => "Matéria é obrigatória"]);
            return;
        }
        
        $this->simulado->id_usuario = $id_usuario;
        
        $data_simulado = $data->data ?? date('Y-m-d H:i:s');
        $timestamp = strtotime($data_simulado);
        $this->simulado->data = ($timestamp !== false) ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
        
        $this->simulado->materia = $data->materia;
        $this->simulado->acertos = $data->acertos ?? 0;
        $this->simulado->erros = $data->erros ?? 0;
        $this->simulado->taxa = $data->taxa ?? 0.00;
        $this->simulado->total = $data->total ?? 0;
        
        if($this->simulado->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Resultado do simulado registrado com sucesso",
                "id_simulado" => $this->simulado->id_simulado
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao registrar resultado de simulado."]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->simulado->id_simulado = $id;
        $this->simulado->id_usuario = $id_usuario;
        
        if($this->simulado->delete()) {
            echo json_encode(["message" => "Simulado deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar simulado."]);
        }
    }
}
?>
